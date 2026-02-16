# Task: gen-list-count_positive-4917 | Score: 100% | 2026-02-13T20:33:07.523231

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))