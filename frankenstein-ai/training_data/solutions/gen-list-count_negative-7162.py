# Task: gen-list-count_negative-7162 | Score: 100% | 2026-02-15T13:00:33.808294

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))