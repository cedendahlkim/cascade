# Task: gen-list-count_negative-6116 | Score: 100% | 2026-02-13T19:35:31.852269

n = int(input())
lst = [int(input()) for _ in range(n)]
print(sum(1 for x in lst if x < 0))