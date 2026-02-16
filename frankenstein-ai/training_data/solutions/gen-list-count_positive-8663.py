# Task: gen-list-count_positive-8663 | Score: 100% | 2026-02-15T10:09:45.845221

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))