# Task: gen-dp2-longest_common_subseq-2309 | Score: 100% | 2026-02-13T10:03:13.326297

s1 = input()
s2 = input()
m, n = len(s1), len(s2)
dp = [[0]*(n+1) for _ in range(m+1)]
for i in range(1, m+1):
    for j in range(1, n+1):
        if s1[i-1] == s2[j-1]:
            dp[i][j] = dp[i-1][j-1] + 1
        else:
            dp[i][j] = max(dp[i-1][j], dp[i][j-1])
print(dp[m][n])