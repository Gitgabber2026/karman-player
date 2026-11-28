"""Entry point for SerumMatcher.exe: no arguments -> window, arguments -> command line."""
import multiprocessing

from serum_matcher.cli import main

if __name__ == "__main__":
    multiprocessing.freeze_support()
    main()
