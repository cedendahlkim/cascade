# Task: gen-ll-reverse_list-5228 | Score: 100% | 2026-02-15T10:28:15.431626

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))