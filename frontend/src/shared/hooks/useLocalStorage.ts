import { useState, useEffect, useCallback } from "react";

type SetValue<T> = T | ((prevValue: T) => T);

export function useLocalStorage<T>(
	key: string,
	initialValue: T
): [T, (value: SetValue<T>) => void] {
	const readValue = useCallback((): T => {
		try {
			const item = localStorage.getItem(key);
			return item ? (JSON.parse(item) as T) : initialValue;
		} catch {
			return initialValue;
		}
	}, [key, initialValue]);

	const [storedValue, setStoredValue] = useState<T>(readValue);

	const setValue = useCallback(
		(value: SetValue<T>) => {
			try {
				const valueToStore =
					value instanceof Function ? value(storedValue) : value;
				setStoredValue(valueToStore);
				localStorage.setItem(key, JSON.stringify(valueToStore));
			} catch {
				setStoredValue(
					value instanceof Function ? value(storedValue) : value
				);
			}
		},
		[key, storedValue]
	);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === key && event.storageArea === localStorage) {
				if (event.newValue === null) {
					setStoredValue(initialValue);
				} else {
					try {
						setStoredValue(JSON.parse(event.newValue) as T);
					} catch {
						setStoredValue(initialValue);
					}
				}
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [key, initialValue]);

	return [storedValue, setValue];
}
