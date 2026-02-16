# Task: gen-ll-reverse_list-6374 | Score: 100% | 2026-02-15T08:48:33.368822

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))