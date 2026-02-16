# Task: gen-list-count_positive-7326 | Score: 100% | 2026-02-15T09:51:20.130451

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))