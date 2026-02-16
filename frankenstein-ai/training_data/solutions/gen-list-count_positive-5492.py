# Task: gen-list-count_positive-5492 | Score: 100% | 2026-02-15T11:13:41.878479

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x > 0))