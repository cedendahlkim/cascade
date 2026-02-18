# Task: gen-algo-two_sum-7087 | Score: 100% | 2026-02-17T20:09:06.517168

n = int(input())
lst = [int(input()) for _ in range(n)]
target = int(input())
for i in range(n):
    for j in range(i+1, n):
        if lst[i] + lst[j] == target:
            print(i, j)
            exit()
print(-1)