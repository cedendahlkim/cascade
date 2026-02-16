# Task: gen-dp-max_subarray-6580 | Score: 100% | 2026-02-11T08:56:28.248528

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