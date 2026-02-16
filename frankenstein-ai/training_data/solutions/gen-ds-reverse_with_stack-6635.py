# Task: gen-ds-reverse_with_stack-6635 | Score: 100% | 2026-02-15T10:28:42.218626

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))