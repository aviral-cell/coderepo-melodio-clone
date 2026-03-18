export default new Proxy(
	{},
	{
		get(_, key: string) {
			return key;
		},
	}
);
