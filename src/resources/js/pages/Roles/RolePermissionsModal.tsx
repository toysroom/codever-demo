import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Role, Permission } from '@/types';
import { useMemo, useState, useEffect } from 'react';

interface RolePermissionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    role: Role | null;
    permissions: Permission[];
}

export default function RolePermissionsModal({ isOpen, onClose, role, permissions }: RolePermissionsModalProps) {
    // Get role permission IDs
    const rolePermissionIds = useMemo(() => {
        if (!role || !role.permissions) return new Set<number>();
        return new Set(role.permissions.map((p) => p.id));
    }, [role]);

    // Group permissions by category
    const permissionsGrouped = useMemo(() => {
        const grouped: Record<string, Permission[]> = {};
        
        permissions.forEach((permission) => {
            const category = permission.category || 'Other';
            if (!grouped[category]) {
                grouped[category] = [];
            }
            grouped[category].push(permission);
        });

        // Sort categories and permissions within each category
        return Object.keys(grouped)
            .sort()
            .reduce((acc, category) => {
                acc[category] = grouped[category].sort((a, b) => a.name.localeCompare(b.name));
                return acc;
            }, {} as Record<string, Permission[]>);
    }, [permissions]);

    // Get all category keys for defaultValue
    const allCategoryKeys = useMemo(() => {
        const keys = Object.keys(permissionsGrouped);
        return keys.length > 0 ? keys : [];
    }, [permissionsGrouped]);

    // State to control which accordions are open (all open by default)
    const [openAccordions, setOpenAccordions] = useState<string[]>(allCategoryKeys);

    // Update open accordions when categories change
    useEffect(() => {
        if (allCategoryKeys.length > 0 && isOpen) {
            setOpenAccordions(allCategoryKeys);
        }
    }, [allCategoryKeys, isOpen]);

    if (!role || allCategoryKeys.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] !max-w-[95vw] overflow-hidden">
                <DialogHeader>
                    <DialogTitle>Permissions for Role: {role.name}</DialogTitle>
                    <DialogDescription>
                        View all permissions and see which ones are assigned to this role. Checkboxes are read-only.
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-[60vh] overflow-y-auto w-full">
                    <Accordion type="multiple" className="w-full" value={openAccordions} onValueChange={setOpenAccordions}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 w-full">
                            {Object.entries(permissionsGrouped).map(([category, categoryPermissions]) => (
                                <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                                    <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                                        <div className="flex items-center justify-between w-full pr-2">
                                            <span>{category}</span>
                                            <span className="text-xs text-muted-foreground font-normal">
                                                ({categoryPermissions.length})
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-1 gap-2 pt-2">
                                            {categoryPermissions.map((permission) => {
                                                const hasPermission = rolePermissionIds.has(permission.id);
                                                return (
                                                    <label
                                                        key={permission.id}
                                                        className="flex cursor-default items-start space-x-3 rounded-md border p-2 transition-colors hover:bg-accent/50"
                                                    >
                                                        <Checkbox
                                                            checked={hasPermission}
                                                            disabled
                                                            className="mt-0.5"
                                                        />
                                                        <div className="flex flex-1 flex-col space-y-1">
                                                            <span className="text-sm font-medium">{permission.name}</span>
                                                            {permission.description && (
                                                                <span className="text-xs text-muted-foreground">{permission.description}</span>
                                                            )}
                                                        </div>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </div>
                    </Accordion>
                </div>
            </DialogContent>
        </Dialog>
    );
}

