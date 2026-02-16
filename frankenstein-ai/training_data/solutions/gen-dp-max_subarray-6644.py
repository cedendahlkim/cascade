# Task: gen-dp-max_subarray-6644 | Score: 100% | 2026-02-12T13:45:49.150956

def max_subarray_sum():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))

    max_so_far = 0
    current_max = 0

    for i in range(n):
        current_max += arr[i]

        if current_max < 0:
            current_max = 0

        if max_so_far < current_max:
            max_so_far = current_max

    if max_so_far == 0:
        max_so_far = max(arr) if arr else 0
        if max_so_far < 0:
            max_so_far = 0

    print(max_so_far)

max_subarray_sum()