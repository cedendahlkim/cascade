# Task: gen-algo-two_sum-5789 | Score: 100% | 2026-02-12T20:55:15.052983

def solve():
    n = int(input())
    nums = []
    for _ in range(n):
        nums.append(int(input()))
    target = int(input())

    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                print(i, j)
                return

    print("-1")

solve()