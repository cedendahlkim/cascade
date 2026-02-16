# Task: gen-ds-reverse_with_stack-6837 | Score: 100% | 2026-02-13T15:28:46.973290

n = int(input())
lst = [int(input()) for _ in range(n)]
print(' '.join(str(x) for x in reversed(lst)))