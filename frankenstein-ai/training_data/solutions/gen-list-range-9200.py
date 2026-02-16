# Task: gen-list-range-9200 | Score: 100% | 2026-02-15T11:13:44.113089

n = int(input())
lst = [int(input()) for _ in range(n)]
print(max(lst) - min(lst))