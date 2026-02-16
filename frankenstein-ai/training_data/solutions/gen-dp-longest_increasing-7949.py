# Task: gen-dp-longest_increasing-7949 | Score: 100% | 2026-02-13T13:54:13.174995

n = int(input())
lst = [int(input()) for _ in range(n)]
dp = [1] * n
for i in range(1, n):
    for j in range(i):
        if lst[j] < lst[i]:
            dp[i] = max(dp[i], dp[j] + 1)
print(max(dp))