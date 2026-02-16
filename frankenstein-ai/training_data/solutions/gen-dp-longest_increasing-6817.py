# Task: gen-dp-longest_increasing-6817 | Score: 100% | 2026-02-15T07:46:44.886731

n = int(input())
lst = [int(input()) for _ in range(n)]
dp = [1] * n
for i in range(1, n):
    for j in range(i):
        if lst[j] < lst[i]:
            dp[i] = max(dp[i], dp[j] + 1)
print(max(dp))