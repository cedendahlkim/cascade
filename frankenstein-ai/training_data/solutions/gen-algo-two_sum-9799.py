# Task: gen-algo-two_sum-9799 | Score: 100% | 2026-02-15T09:16:27.610765

n = int(input())
lst = [int(input()) for _ in range(n)]
target = int(input())
for i in range(n):
    for j in range(i+1, n):
        if lst[i] + lst[j] == target:
            print(i, j)
            exit()
print(-1)