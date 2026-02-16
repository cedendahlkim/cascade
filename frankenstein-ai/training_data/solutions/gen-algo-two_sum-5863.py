# Task: gen-algo-two_sum-5863 | Score: 100% | 2026-02-12T12:25:14.489468

n = int(input())
nums = []
for i in range(n):
    nums.append(int(input()))
target = int(input())

found = False
for i in range(n):
    for j in range(i + 1, n):
        if nums[i] + nums[j] == target:
            print(i, j)
            found = True
            break
    if found:
        break

if not found:
    print("-1")