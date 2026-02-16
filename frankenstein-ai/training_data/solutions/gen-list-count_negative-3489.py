# Task: gen-list-count_negative-3489 | Score: 100% | 2026-02-15T08:24:20.120700

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))