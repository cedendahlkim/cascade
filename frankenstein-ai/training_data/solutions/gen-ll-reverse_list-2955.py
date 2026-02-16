# Task: gen-ll-reverse_list-2955 | Score: 100% | 2026-02-15T08:35:04.766509

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))