# Task: gen-ds-reverse_with_stack-3921 | Score: 100% | 2026-02-13T16:26:44.246776

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))