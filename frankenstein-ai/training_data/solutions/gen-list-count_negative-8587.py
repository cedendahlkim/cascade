# Task: gen-list-count_negative-8587 | Score: 100% | 2026-02-13T09:15:57.095674

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))