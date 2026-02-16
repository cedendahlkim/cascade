# Task: gen-algo-two_sum-6912 | Score: 100% | 2026-02-12T12:42:15.915695

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    target = int(input())

    num_map = {}
    for i in range(n):
        complement = target - nums[i]
        if complement in num_map:
            print(num_map[complement], i)
            return
        num_map[nums[i]] = i
    print("-1")

solve()