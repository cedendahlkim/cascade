# Task: gen-dp-max_subarray-4003 | Score: 100% | 2026-02-12T17:21:53.203928

def max_subarray_sum():
    n = int(input())
    arr = []
    for _ in range(n):
        arr.append(int(input()))

    max_so_far = float('-inf')
    current_max = 0

    for i in range(n):
        current_max += arr[i]

        if current_max > max_so_far:
            max_so_far = current_max

        if current_max < 0:
            current_max = 0

    if max_so_far == float('-inf') and all(x < 0 for x in arr):
        print(max(arr))
    elif max_so_far == float('-inf'):
        print(0)
    else:
        print(max_so_far)

max_subarray_sum()