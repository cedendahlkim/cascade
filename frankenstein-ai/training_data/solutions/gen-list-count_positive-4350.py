# Task: gen-list-count_positive-4350 | Score: 100% | 2026-02-13T14:01:35.596861

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))