# Task: gen-ll-reverse_list-3459 | Score: 100% | 2026-02-14T12:04:27.805219

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))