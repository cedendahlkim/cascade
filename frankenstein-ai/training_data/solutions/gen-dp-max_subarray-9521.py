# Task: gen-dp-max_subarray-9521 | Score: 100% | 2026-02-12T19:16:41.365300

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
        max_val = float('-inf')
        for x in arr:
            if x > max_val:
                max_val = x
        if max_val < 0:
            print(0)
        else:
            print(max_so_far)
    else:
        print(max_so_far)

max_subarray_sum()