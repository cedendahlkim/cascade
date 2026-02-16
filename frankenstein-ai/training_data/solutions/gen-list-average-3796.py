# Task: gen-list-average-3796 | Score: 100% | 2026-02-13T18:39:59.184810

n = int(input())
lst = [int(input()) for _ in range(n)]
print(round(sum(lst) / len(lst)))