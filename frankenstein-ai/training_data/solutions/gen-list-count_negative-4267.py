# Task: gen-list-count_negative-4267 | Score: 100% | 2026-02-13T18:29:56.348327

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))