# Task: gen-ds-reverse_with_stack-1810 | Score: 100% | 2026-02-15T07:46:24.882210

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))