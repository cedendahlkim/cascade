# Task: gen-ds-reverse_with_stack-1900 | Score: 100% | 2026-02-13T16:47:12.384261

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))