# Task: gen-algo-two_sum-6333 | Score: 100% | 2026-02-12T19:49:51.559933

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