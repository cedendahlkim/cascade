# Task: gen-ll-reverse_list-7572 | Score: 100% | 2026-02-15T07:48:26.441569

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))