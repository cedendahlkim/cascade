# Task: gen-algo-two_sum-6280 | Score: 100% | 2026-02-15T07:59:40.529074

n = int(input())
lst = [int(input()) for _ in range(n)]
target = int(input())
for i in range(n):
    for j in range(i+1, n):
        if lst[i] + lst[j] == target:
            print(i, j)
            exit()
print(-1)