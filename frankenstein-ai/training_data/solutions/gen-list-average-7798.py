# Task: gen-list-average-7798 | Score: 100% | 2026-02-14T13:11:12.665202

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))