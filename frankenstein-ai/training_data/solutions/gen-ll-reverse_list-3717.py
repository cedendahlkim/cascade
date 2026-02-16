# Task: gen-ll-reverse_list-3717 | Score: 100% | 2026-02-13T21:27:24.486579

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))