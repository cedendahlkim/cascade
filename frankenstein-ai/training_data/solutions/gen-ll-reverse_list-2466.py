# Task: gen-ll-reverse_list-2466 | Score: 100% | 2026-02-14T12:36:58.887854

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))