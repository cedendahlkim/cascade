# Task: gen-algo-two_sum-2928 | Score: 100% | 2026-02-12T19:56:22.719753

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    target = int(input())

    num_map = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in num_map:
            print(num_map[complement], i)
            return
        num_map[num] = i

    print("-1")

solve()