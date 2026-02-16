# Task: gen-dp-max_subarray-4549 | Score: 100% | 2026-02-10T16:56:41.048294

def kadane():
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

    if max_so_far == float('-inf'):
        print(max(arr))
    else:
        print(max_so_far)
kadane()