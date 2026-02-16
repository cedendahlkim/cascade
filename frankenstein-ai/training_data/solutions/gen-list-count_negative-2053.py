# Task: gen-list-count_negative-2053 | Score: 100% | 2026-02-13T11:34:35.993744

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))