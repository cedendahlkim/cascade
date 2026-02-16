# Task: gen-list-count_positive-9762 | Score: 100% | 2026-02-14T13:12:28.443895

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))