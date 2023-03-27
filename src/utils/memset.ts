export function memset(arr: Array<any>, value: any, ...dim: number[]) {
	if (dim.length == 1) {
		for (let i = 0; i < dim[0]; i++) {
			arr.push(value);
		}
	} else {
		for (let i = 0; i < dim[0]; i++) {
			arr.push([]);
			memset(arr[i], value, ...dim.slice(1));
		}
	}
}
