# Task: gen-dp-max_subarray-6025 | Score: 100% | 2026-02-11T12:08:18.032188

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))

    max_so_far = float('-inf')
    current_max = 0

    for i in range(n):
        current_max += nums[i]

        if current_max > max_so_far:
            max_so_far = current_max

        if current_max < 0:
            current_max = 0

    print(max_so_far)

solve()