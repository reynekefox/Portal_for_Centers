import { toast } from '@/hooks/use-toast';

// API wrapper with error handling
export async function apiCall<T>(
    operation: () => Promise<T>,
    options?: {
        successMessage?: string;
        errorMessage?: string;
        showSuccess?: boolean;
    }
): Promise<T | null> {
    try {
        const result = await operation();

        if (options?.showSuccess && options?.successMessage) {
            toast({
                title: 'Успешно',
                description: options.successMessage,
            });
        }

        return result;
    } catch (error) {
        console.error('API Error:', error);

        toast({
            variant: 'destructive',
            title: 'Ошибка',
            description: options?.errorMessage || 'Произошла ошибка при выполнении операции',
        });

        return null;
    }
}

// Common API operations with pre-defined messages
export const withErrorHandling = {
    async save<T>(operation: () => Promise<T>, entityName: string): Promise<T | null> {
        return apiCall(operation, {
            successMessage: `${entityName} сохранено`,
            errorMessage: `Не удалось сохранить ${entityName.toLowerCase()}`,
            showSuccess: true
        });
    },

    async delete<T>(operation: () => Promise<T>, entityName: string): Promise<T | null> {
        return apiCall(operation, {
            successMessage: `${entityName} удалено`,
            errorMessage: `Не удалось удалить ${entityName.toLowerCase()}`,
            showSuccess: true
        });
    },

    async load<T>(operation: () => Promise<T>, entityName: string): Promise<T | null> {
        return apiCall(operation, {
            errorMessage: `Не удалось загрузить ${entityName.toLowerCase()}`
        });
    }
};
