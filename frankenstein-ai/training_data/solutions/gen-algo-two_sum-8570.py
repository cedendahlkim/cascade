# Task: gen-algo-two_sum-8570 | Score: 100% | 2026-02-12T15:55:54.424468

n = int(input())
nums = []
for i in range(n):
    nums.append(int(input()))
target = int(input())

seen = {}
for i, num in enumerate(nums):
    complement = target - num
    if complement in seen:
        print(seen[complement], i)
        exit()
    seen[num] = i

print(-1)