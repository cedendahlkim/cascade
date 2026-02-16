# Task: gen-dp2-edit_distance-2764 | Score: 100% | 2026-02-11T12:19:53.093770

def edit_distance(s1, s2):
    len_s1 = len(s1)
    len_s2 = len(s2)
    dp = [[0] * (len_s2 + 1) for _ in range(len_s1 + 1)]

    for i in range(len_s1 + 1):
        dp[i][0] = i
    for j in range(len_s2 + 1):
        dp[0][j] = j

    for i in range(1, len_s1 + 1):
        for j in range(1, len_s2 + 1):
            if s1[i - 1] == s2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])

    return dp[len_s1][len_s2]

s1 = input()
s2 = input()
print(edit_distance(s1, s2))