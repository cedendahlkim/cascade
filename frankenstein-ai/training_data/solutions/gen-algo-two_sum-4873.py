# Task: gen-algo-two_sum-4873 | Score: 100% | 2026-02-12T12:18:38.250928

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